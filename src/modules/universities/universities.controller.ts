import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UniversitiesService } from './universities.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesEnum } from '../roles/enums/roles.enum';

@ApiTags('Universities')
@Controller('universities')
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @Post()
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Create a new university (Admin only)' })
  @ApiResponse({ status: 201, description: 'University created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - requires ADMIN role' })
  create(@Body() createUniversityDto: CreateUniversityDto) {
    return this.universitiesService.create(createUniversityDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all universities' })
  @ApiResponse({ status: 200, description: 'List of universities' })
  findAll() {
    return this.universitiesService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search universities by name' })
  @ApiQuery({
    name: 'q',
    type: 'string',
    description: 'Search query',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Search results' })
  search(@Query('q') query: string) {
    return this.universitiesService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get university by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'University ID' })
  @ApiResponse({ status: 200, description: 'University data' })
  @ApiResponse({ status: 404, description: 'University not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.universitiesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @Patch(':id')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Update university by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'University ID' })
  @ApiResponse({ status: 200, description: 'University updated successfully' })
  @ApiResponse({ status: 404, description: 'University not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - requires ADMIN role' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUniversityDto: UpdateUniversityDto,
  ) {
    return this.universitiesService.update(id, updateUniversityDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolesEnum.ADMIN)
  @Delete(':id')
  @ApiCookieAuth('accessToken')
  @ApiOperation({ summary: 'Delete university by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'number', description: 'University ID' })
  @ApiResponse({ status: 200, description: 'University deleted successfully' })
  @ApiResponse({ status: 404, description: 'University not found' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden - requires ADMIN role' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.universitiesService.remove(id);
  }
}
