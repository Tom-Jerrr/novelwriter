"""Add run-level copilot context snapshots.

Deletion notes:
- Removes the implicit coupling where queued/running copilot runs read mutable
  UI continuity hints from the reusable session row.
- Atlas/studio session reuse can now update the session context without
  retargeting an already queued run.

Rollback:
- `alembic downgrade 027`
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "028"
down_revision: Union[str, None] = "027"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "copilot_runs" not in tables or "copilot_sessions" not in tables:
        return

    run_columns = {column["name"] for column in inspector.get_columns("copilot_runs")}
    if "context_json" not in run_columns:
        dialect = bind.dialect.name if bind is not None else ""
        if dialect == "sqlite":
            with op.batch_alter_table("copilot_runs") as batch_op:
                batch_op.add_column(sa.Column("context_json", sa.JSON(), nullable=True))
        else:
            op.add_column("copilot_runs", sa.Column("context_json", sa.JSON(), nullable=True))

    run_table = sa.table(
        "copilot_runs",
        sa.column("copilot_session_id", sa.Integer),
        sa.column("context_json", sa.JSON()),
    )
    session_table = sa.table(
        "copilot_sessions",
        sa.column("id", sa.Integer),
        sa.column("context_json", sa.JSON()),
    )
    op.execute(
        run_table.update().values(
            context_json=sa.select(session_table.c.context_json)
            .where(session_table.c.id == run_table.c.copilot_session_id)
            .scalar_subquery()
        )
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "copilot_runs" not in tables:
        return

    run_columns = {column["name"] for column in inspector.get_columns("copilot_runs")}
    if "context_json" not in run_columns:
        return

    dialect = bind.dialect.name if bind is not None else ""
    if dialect == "sqlite":
        with op.batch_alter_table("copilot_runs") as batch_op:
            batch_op.drop_column("context_json")
    else:
        op.drop_column("copilot_runs", "context_json")
