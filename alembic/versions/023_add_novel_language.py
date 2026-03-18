"""Add novels.language

- New novels carry an explicit language code so prompt-locale resolution can
  stop depending on implicit Chinese defaults.
- Existing rows default to `zh` for compatibility with the current prompt
  catalog while multilingual runtime support is being introduced incrementally.

Deletion notes:
- Removes the need to infer prompt locale only from call-site defaults.

Rollback:
- `alembic downgrade 022`
"""

from typing import Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "023"
down_revision: Union[str, None] = "022"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("novels")}
    if "language" in columns:
        return

    with op.batch_alter_table("novels") as batch_op:
        batch_op.add_column(
            sa.Column(
                "language",
                sa.String(length=50),
                nullable=False,
                server_default="zh",
            )
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("novels")}
    if "language" not in columns:
        return

    with op.batch_alter_table("novels") as batch_op:
        batch_op.drop_column("language")
