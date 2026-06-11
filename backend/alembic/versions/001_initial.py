"""initial

Revision ID: 001
Revises:
Create Date: 2026-06-11
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(100), nullable=False),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("height_cm", sa.Integer(), nullable=True),
        sa.Column("birth_date", sa.Date(), nullable=True),
        sa.Column("sex", sa.Enum("male", "female", name="sex_enum"), nullable=True),
        sa.Column("country", sa.String(100), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column(
            "role",
            sa.Enum("user", "admin", name="role_enum"),
            nullable=False,
            server_default="user",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_table(
        "exercises",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column(
            "category",
            sa.Enum("Musculation", "Cardio", "Stretching", "HIIT", name="category_enum"),
            nullable=False,
        ),
        sa.Column("muscle_groups", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("met_value", sa.Float(), nullable=False, server_default="3.5"),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_by", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
    )

    op.create_table(
        "goals",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False, index=True),
        sa.Column("title", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "goal_type",
            sa.Enum("frequency", "volume", "weight", "calories", name="goal_type_enum"),
            nullable=False,
        ),
        sa.Column("target_value", sa.Float(), nullable=False),
        sa.Column("current_value", sa.Float(), nullable=False, server_default="0"),
        sa.Column("unit", sa.String(20), nullable=False),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("active", "completed", "archived", name="goal_status_enum"),
            nullable=False,
            server_default="active",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )

    op.create_table(
        "workout_sessions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), nullable=False, index=True),
        sa.Column("title", sa.String(100), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("total_calories", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )

    op.create_table(
        "workout_exercises",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("session_id", sa.String(), nullable=False),
        sa.Column("exercise_id", sa.String(), nullable=False),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("rest_seconds", sa.Integer(), nullable=True),
        sa.Column("calories_burned", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["workout_sessions.id"]),
        sa.ForeignKeyConstraint(["exercise_id"], ["exercises.id"]),
    )

    op.create_table(
        "exercise_sets",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("workout_exercise_id", sa.String(), nullable=False),
        sa.Column("set_number", sa.Integer(), nullable=False),
        sa.Column("reps", sa.Integer(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("completed", sa.Boolean(), nullable=False, server_default="true"),
        sa.ForeignKeyConstraint(["workout_exercise_id"], ["workout_exercises.id"]),
    )

    op.create_table(
        "nutrition_suggestions",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("session_id", sa.String(), nullable=False, unique=True),
        sa.Column("calories_burned", sa.Float(), nullable=False),
        sa.Column(
            "context",
            sa.Enum("recovery", "meal_plan", "both", name="context_enum"),
            nullable=False,
        ),
        sa.Column("country", sa.String(), nullable=False),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column("suggestion_json", sa.JSON(), nullable=False),
        sa.Column(
            "generated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(["session_id"], ["workout_sessions.id"]),
    )


def downgrade() -> None:
    op.drop_table("nutrition_suggestions")
    op.drop_table("exercise_sets")
    op.drop_table("workout_exercises")
    op.drop_table("workout_sessions")
    op.drop_table("goals")
    op.drop_table("exercises")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS sex_enum")
    op.execute("DROP TYPE IF EXISTS role_enum")
    op.execute("DROP TYPE IF EXISTS category_enum")
    op.execute("DROP TYPE IF EXISTS goal_type_enum")
    op.execute("DROP TYPE IF EXISTS goal_status_enum")
    op.execute("DROP TYPE IF EXISTS context_enum")
