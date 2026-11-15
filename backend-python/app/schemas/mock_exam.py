from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.problem import ProblemSummary


class MockExamRequest(BaseModel):
    quantity: int = Field(gt=0, le=100, description="Quantidade de questões desejada (1 a 100)")
    area: Optional[str] = None
    minDifficulty: int = Field(default=1, ge=1, le=5)
    maxDifficulty: int = Field(default=5, ge=1, le=5)
    includeStatements: bool = Field(
        default=False,
        description="Se true, cada questão vem com enunciado, dica e solução (para montar a prova imprimível)",
    )

    @field_validator("maxDifficulty")
    @classmethod
    def max_not_less_than_min(cls, v, info):
        min_value = info.data.get("minDifficulty")
        if min_value is not None and v < min_value:
            raise ValueError("maxDifficulty não pode ser menor que minDifficulty")
        return v


class ExamProblem(ProblemSummary):
    statement: Optional[str] = None
    hint: Optional[str] = None
    solution: Optional[str] = None
    source: Optional[str] = None


class MockExamResponse(BaseModel):
    problems: list[ExamProblem]
