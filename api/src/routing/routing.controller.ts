import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ComputeRouteDto } from './dto/compute-route.dto';
import { RoutingService } from './routing.service';

@Controller('routing')
export class RoutingController {
  constructor(private readonly routing: RoutingService) {}

  @Post('compute')
  compute(@Body() dto: ComputeRouteDto) {
    return this.routing.compute(dto);
  }

  @Post('recompute')
  recompute(@Body() dto: ComputeRouteDto) {
    return this.routing.recompute(dto);
  }

  @Get('instructions/:id')
  instructions(@Param('id') id: string) {
    return this.routing.getInstructions(id);
  }
}
