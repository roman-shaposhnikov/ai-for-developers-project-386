import { IsInt, Length, Matches, Max, Min } from 'class-validator';

export class CreateEventDto {
  @Length(1, 100)
  title!: string;

  @Length(1, 1000)
  description!: string;

  @IsInt()
  @Min(5)
  @Max(480)
  duration!: number;

  @Length(1, 60)
  @Matches(/^[a-z][a-z0-9-]*$/)
  slug!: string;
}
