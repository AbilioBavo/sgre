import { PartialType } from '@nestjs/mapped-types';
import { CreateRiskZoneDto } from './create-risk-zone.dto';

export class UpdateRiskZoneDto extends PartialType(CreateRiskZoneDto) {}
