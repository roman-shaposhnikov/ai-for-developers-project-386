import { IsString, IsInt, Min, Max, Length, Matches } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @Length(1, 100)
  title: string;

  @IsString()
  @Length(1, 1000)
  description: string;

  @IsInt()
  @Min(5)
  @Max(480)
  duration: number;

  @IsString()
  @Length(1, 60)
  @Matches(/^[a-z][a-z0-9-]*$/, {
    message: 'Slug must start with a letter and contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;
}
