import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from '../config/typeorm.config';

export default new DataSource(buildTypeOrmOptions(process.env));
