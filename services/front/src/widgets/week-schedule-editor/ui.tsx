import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Button,
  Group,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconCopy, IconPlus, IconTrash } from '@tabler/icons-react';
import { browserTimezone, WEEKDAYS, type Weekday, type Weekdays } from '@/shared/lib/time';
import {
  addBlock,
  copyBlocksToOtherDays,
  removeBlock,
  setDayEnabled,
  updateBlock,
  validateWeek,
} from './model';

const WEEKDAY_LABEL: Record<Weekday, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const COMMON_TZ = [
  'UTC',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Tokyo',
  'America/New_York',
  'America/Los_Angeles',
];

const HHMM_RE = /^([01]\d|2[0-3]):[0-5][05]$/;

interface Props {
  initialLocalWeek: Weekdays;
  initialTz?: string;
  saving?: boolean;
  onSave: (localWeek: Weekdays, tz: string) => void;
}

export function WeekScheduleEditor({ initialLocalWeek, initialTz, saving, onSave }: Props) {
  const [week, setWeek] = useState<Weekdays>(initialLocalWeek);
  const [tz, setTz] = useState<string>(initialTz ?? browserTimezone());

  const tzOptions = useMemo(() => {
    const set = new Set<string>([browserTimezone(), ...COMMON_TZ, tz]);
    return Array.from(set).map((value) => ({ value, label: value }));
  }, [tz]);

  const validation = useMemo(() => validateWeek(week), [week]);

  const handleSave = () => {
    if (!validation.valid) return;
    onSave(week, tz);
  };

  return (
    <Stack>
      <Group justify="space-between" align="flex-start">
        <Title order={3}>Working hours</Title>
        <Group>
          <Select
            label="Timezone"
            value={tz}
            onChange={(v) => v && setTz(v)}
            data={tzOptions}
            searchable
            allowDeselect={false}
            w={260}
          />
          <Button onClick={handleSave} loading={saving} disabled={!validation.valid}>
            Save
          </Button>
        </Group>
      </Group>

      <Paper withBorder p="md">
        <Stack gap="md">
          {WEEKDAYS.map((wd) => {
            const day = week[wd];
            const dayError = validation.errors[wd];
            return (
              <Stack key={wd} gap="xs">
                <Group align="center" wrap="nowrap">
                  <Switch
                    checked={day.enabled}
                    onChange={(e) =>
                      setWeek((w) => setDayEnabled(w, wd, e.currentTarget.checked))
                    }
                    aria-label={`Toggle ${WEEKDAY_LABEL[wd]}`}
                    label={<Text w={110}>{WEEKDAY_LABEL[wd]}</Text>}
                  />
                  <Stack gap="xs" flex={1}>
                    {!day.enabled && (
                      <Text c="dimmed" size="sm">
                        Unavailable
                      </Text>
                    )}
                    {day.enabled &&
                      day.blocks.map((block, idx) => (
                        <Group key={idx} gap="xs">
                          <TextInput
                            value={block.start}
                            onChange={(e) =>
                              setWeek((w) =>
                                updateBlock(w, wd, idx, { start: e.currentTarget.value }),
                              )
                            }
                            placeholder="09:00"
                            error={!HHMM_RE.test(block.start)}
                            w={100}
                            aria-label="Start time"
                          />
                          <Text>—</Text>
                          <TextInput
                            value={block.end}
                            onChange={(e) =>
                              setWeek((w) =>
                                updateBlock(w, wd, idx, { end: e.currentTarget.value }),
                              )
                            }
                            placeholder="17:00"
                            error={!HHMM_RE.test(block.end)}
                            w={100}
                            aria-label="End time"
                          />
                          <Tooltip label="Add another block">
                            <ActionIcon
                              variant="subtle"
                              onClick={() => setWeek((w) => addBlock(w, wd))}
                              aria-label="Add block"
                            >
                              <IconPlus size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Remove block">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => setWeek((w) => removeBlock(w, wd, idx))}
                              aria-label="Remove block"
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                          {idx === 0 && (
                            <Tooltip label="Copy to other days">
                              <ActionIcon
                                variant="subtle"
                                onClick={() => setWeek((w) => copyBlocksToOtherDays(w, wd))}
                                aria-label="Copy to other days"
                              >
                                <IconCopy size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      ))}
                    {dayError && (
                      <Text size="xs" c="red">
                        {dayError}
                      </Text>
                    )}
                  </Stack>
                </Group>
              </Stack>
            );
          })}
        </Stack>
      </Paper>
    </Stack>
  );
}
