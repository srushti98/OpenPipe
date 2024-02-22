# This file was auto-generated by Fern from our API Definition.

import datetime as dt
import typing

from ..core.datetime_utils import serialize_datetime
from .unstable_finetune_get_response_status import UnstableFinetuneGetResponseStatus

try:
    import pydantic.v1 as pydantic  # type: ignore
except ImportError:
    import pydantic  # type: ignore


class UnstableFinetuneGetResponse(pydantic.BaseModel):
    id: str
    status: UnstableFinetuneGetResponseStatus
    slug: str
    base_model: str = pydantic.Field(alias="baseModel")
    error_message: typing.Optional[str] = pydantic.Field(alias="errorMessage")
    dataset_id: str = pydantic.Field(alias="datasetId")
    created_at: str = pydantic.Field(alias="createdAt")

    def json(self, **kwargs: typing.Any) -> str:
        kwargs_with_defaults: typing.Any = {"by_alias": True, "exclude_unset": True, **kwargs}
        return super().json(**kwargs_with_defaults)

    def dict(self, **kwargs: typing.Any) -> typing.Dict[str, typing.Any]:
        kwargs_with_defaults: typing.Any = {"by_alias": True, "exclude_unset": True, **kwargs}
        return super().dict(**kwargs_with_defaults)

    class Config:
        frozen = True
        smart_union = True
        allow_population_by_field_name = True
        json_encoders = {dt.datetime: serialize_datetime}