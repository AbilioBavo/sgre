import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: { name: dto.name, phone: dto.phone, deviceId: dto.deviceId },
      select: { id: true, name: true, phone: true, role: true, createdAt: true },
    });
  }

  findAll() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, phone: true, email: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException();
    return user;
  }

  async findByDevice(deviceId: string) {
    return this.prisma.user.findUnique({
      where: { deviceId },
      select: { id: true, name: true, deviceId: true, role: true },
    });
  }

  async ensureDevice(deviceId: string) {
    let u = await this.prisma.user.findUnique({ where: { deviceId } });
    if (!u) {
      try {
        u = await this.prisma.user.create({
          data: {
            name: 'Utilizador',
            phone: `device:${deviceId}`,
            deviceId,
            role: 'USER',
          },
        });
      } catch {
        u = await this.prisma.user.findUnique({ where: { deviceId } });
      }
    }
    return u!;
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, phone: true, role: true },
    });
  }

  async remove(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { id };
  }

  async updateMyLocation(deviceId: string, dto: UpdateLocationDto) {
    const u = await this.ensureDevice(deviceId);
    await this.prisma.$executeRaw`
      UPDATE "User"
         SET "currentLocation" = ST_SetSRID(ST_MakePoint(${dto.lng}, ${dto.lat}), 4326),
             "lastSeenAt"      = NOW()
       WHERE id = ${u.id}::uuid
    `;
    return { id: u.id, deviceId: u.deviceId, lat: dto.lat, lng: dto.lng };
  }
}
