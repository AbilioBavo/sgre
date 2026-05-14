import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateIncidentDto } from './create-incident.dto';

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {
  @IsOptional()
  @IsEnum(['PENDING', 'VERIFIED', 'REJECTED', 'RESOLVED'])
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RESOLVED';
}
