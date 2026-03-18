"""Add quick action linkage to copilot runs.

- Persists the selected quick action separately from the user-visible prompt so
  backend prompt scaffolding does not leak into the drawer request bubble.

Deletion notes:
- Removes the need to overload `copilot_runs.prompt` with internal research
  focus prefixes.

Rollback:
- `alembic downgrade 026`
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "027"
down_revision: Union[str, None] = "026"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "copilot_runs" not in tables:
        return

    run_columns = {column["name"] for column in inspector.get_columns("copilot_runs")}
    if "quick_action_id" in run_columns:
        return

    dialect = bind.dialect.name if bind is not None else ""
    if dialect == "sqlite":
        with op.batch_alter_table("copilot_runs") as batch_op:
            batch_op.add_column(sa.Column("quick_action_id", sa.String(length=64), nullable=True))
    else:
        op.add_column("copilot_runs", sa.Column("quick_action_id", sa.String(length=64), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "copilot_runs" not in tables:
        return

    run_columns = {column["name"] for column in inspector.get_columns("copilot_runs")}
    if "quick_action_id" not in run_columns:
        return

    dialect = bind.dialect.name if bind is not None else ""
    if dialect == "sqlite":
        with op.batch_alter_table("copilot_runs") as batch_op:
            batch_op.drop_column("quick_action_id")
    else:
        op.drop_column("copilot_runs", "quick_action_id")
