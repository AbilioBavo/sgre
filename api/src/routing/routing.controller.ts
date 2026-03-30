import { Body, Controller, Post } from '@nestjs/common';
import { CreateRoutingDto } from './dto/create-routing.dto';
import { RoutingService } from './routing.service';

@Controller('routing')
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Post('evacuate')
  getEvacuationRoutes(@Body() createRoutingDto: CreateRoutingDto) {
    return this.routingService.getEvacuationRoutes(createRoutingDto);
  }
}
