import { IsNumber, Max, Min } from 'class-validator';

export class CreateRoutingDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  startLat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  startLng: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  endLat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  endLng: number;
}
