"""add multi_step_requirement to alarms

Revision ID: 82c0a1dd7572
Revises: 
Create Date: 2026-07-07 12:23:07.827898

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import app.models.base


# revision identifiers, used by Alembic.
revision: str = '82c0a1dd7572'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema: Only add the missing column."""
    # We use server_default='1' so existing alarms don't break the nullable=False constraint
    op.add_column('alarms', sa.Column('multi_step_requirement', sa.Integer(), server_default='1', nullable=False))

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('alarms', 'multi_step_requirement')