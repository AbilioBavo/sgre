import { Injectable } from '@nestjs/common';
import { CreateRiskZoneDto } from './dto/create-risk-zone.dto';
import { UpdateRiskZoneDto } from './dto/update-risk-zone.dto';

@Injectable()
export class RiskZonesService {
  create(createRiskZoneDto: CreateRiskZoneDto) {
    return 'This action adds a new riskZone';
  }

  findAll() {
    return `This action returns all riskZones`;
  }

  findOne(id: number) {
    return `This action returns a #${id} riskZone`;
  }

  update(id: number, updateRiskZoneDto: UpdateRiskZoneDto) {
    return `This action updates a #${id} riskZone`;
  }

  remove(id: number) {
    return `This action removes a #${id} riskZone`;
  }
}
