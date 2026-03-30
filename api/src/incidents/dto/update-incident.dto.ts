import { IsEnum } from 'class-validator';
import { IncidentStatus } from '../incidents.types';

export class UpdateIncidentStatusDto {
  @IsEnum(IncidentStatus)
  status: IncidentStatus;
}
