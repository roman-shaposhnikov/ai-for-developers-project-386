import { IsString, IsInt, Min, Max, Length, IsBoolean, IsOptional } from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  title?: string;

  @IsOptional()
  @IsString()
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
