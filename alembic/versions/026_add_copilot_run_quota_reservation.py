"""Add copilot run quota reservation linkage.

- Persists the hosted quota reservation id on each copilot run so background
  completion/error paths can settle billing exactly once.

Deletion notes:
- Removes the transient-only quota ownership path for copilot runs.

Rollback:
- `alembic downgrade 025`
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "026"
down_revision: Union[str, None] = "025"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "copilot_runs" not in tables:
        return

    run_columns = {column["name"] for column in inspector.get_columns("copilot_runs")}
    if "quota_reservation_id" in run_columns:
        return

    dialect = bind.dialect.name if bind is not None else ""
    if dialect == "sqlite":
        with op.batch_alter_table("copilot_runs") as batch_op:
            batch_op.add_column(sa.Column("quota_reservation_id", sa.Integer(), nullable=True))
    else:
        op.add_column("copilot_runs", sa.Column("quota_reservation_id", sa.Integer(), nullable=True))

    if "quota_reservations" in tables and dialect != "sqlite":
        inspector = sa.inspect(bind)
        fk_names = {(fk.get("name") or "") for fk in inspector.get_foreign_keys("copilot_runs")}
        if "fk_copilot_runs_quota_reservation_id" not in fk_names:
            op.create_foreign_key(
                "fk_copilot_runs_quota_reservation_id",
                "copilot_runs",
                "quota_reservations",
                ["quota_reservation_id"],
                ["id"],
            )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())
    if "copilot_runs" not in tables:
        return

    run_columns = {column["name"] for column in inspector.get_columns("copilot_runs")}
    if "quota_reservation_id" not in run_columns:
        return

    dialect = bind.dialect.name if bind is not None else ""
    if dialect != "sqlite":
        fk_names = {(fk.get("name") or "") for fk in inspector.get_foreign_keys("copilot_runs")}
        if "fk_copilot_runs_quota_reservation_id" in fk_names:
            op.drop_constraint("fk_copilot_runs_quota_reservation_id", "copilot_runs", type_="foreignkey")

    if dialect == "sqlite":
        with op.batch_alter_table("copilot_runs") as batch_op:
            batch_op.drop_column("quota_reservation_id")
    else:
        op.drop_column("copilot_runs", "quota_reservation_id")
