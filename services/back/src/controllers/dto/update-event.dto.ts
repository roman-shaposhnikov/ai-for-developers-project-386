import {
  IsBoolean,
  IsInt,
  IsOptional,
  Length,
  Max,
  Min,
} from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @Length(1, 100)
  title?: string;

  @IsOptional()
  @Length(1, 1000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(480)
  duration?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
