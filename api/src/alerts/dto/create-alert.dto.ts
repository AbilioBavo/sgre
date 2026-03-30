import { IsEnum, IsString } from 'class-validator';

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class CreateAlertDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsEnum(AlertSeverity)
  severity: AlertSeverity;
}
