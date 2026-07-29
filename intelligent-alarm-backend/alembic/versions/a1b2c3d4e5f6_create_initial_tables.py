from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0001'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=True),
        sa.Column('oauth_provider', sa.String(50), nullable=True),
        sa.Column('oauth_id', sa.String(255), nullable=True),
        sa.Column('full_name', sa.String(150), nullable=False),
        sa.Column('role', sa.Enum('USER', 'WELLNESS_COACH', 'ADMIN', name='userrole'), nullable=False, server_default='USER'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('timezone', sa.String(50), nullable=False, server_default='UTC'),
        sa.Column('difficulty_preference', sa.Enum('BEGINNER', 'EASY', 'MEDIUM', 'HARD', 'EXPERT', name='difficultylevel'), nullable=True),
        sa.Column('productivity_goal', sa.String(255), nullable=True),
        sa.Column('target_bedtime', sa.Time(timezone=True), nullable=True),
        sa.Column('target_wake_time', sa.Time(timezone=True), nullable=True),
        sa.Column('habit_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('current_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('preferred_challenges', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'alarms',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('label', sa.String(100), nullable=False),
        sa.Column('time', sa.Time(), nullable=False),
        sa.Column('alarm_type', sa.Enum('DAILY', 'WEEKDAY', 'WEEKEND', 'ONE_TIME', 'SMART_ADAPTIVE', name='alarmtype'), nullable=False),
        sa.Column('recurrence_days', sa.String(50), nullable=True),
        sa.Column('preferred_challenges', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('snooze_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('snooze_limit', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('active_snooze_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_snooze_reset_date', sa.Date(), nullable=True),
        sa.Column('multi_step_requirement', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        'habits',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(150), nullable=False),
        sa.Column('frequency', sa.Enum('DAILY', 'WEEKDAYS', 'CUSTOM', name='habitfrequency'), nullable=False, server_default='DAILY'),
        sa.Column('target_streak_days', sa.Integer(), nullable=True),
        sa.Column('current_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('longest_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('habit_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        'habit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('habit_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('habits.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('log_date', sa.Date(), nullable=False),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('snooze_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('habit_logs')
    op.drop_table('habits')
    op.drop_table('alarms')
    op.drop_table('users')
    op.execute('DROP TYPE IF EXISTS userrole')
    op.execute('DROP TYPE IF EXISTS difficultylevel')
    op.execute('DROP TYPE IF EXISTS alarmtype')
    op.execute('DROP TYPE IF EXISTS habitfrequency')