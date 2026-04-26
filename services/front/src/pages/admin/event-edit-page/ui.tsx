import { useEffect } from 'react';
import {
  ActionIcon,
  Alert,
  Anchor,
  Button,
  Group,
  Loader,
  NumberInput,
  Paper,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconExternalLink } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { eventKeys, getAdminEvent, updateEvent } from '@/entities/event';
import { DeleteEventButton } from '@/features/event-types/delete-event';
import { routes } from '@/shared/config/routes';

export function EventEditPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: eventKeys.adminDetail(slug),
    queryFn: () => getAdminEvent(slug),
    enabled: !!slug,
  });

  const form = useForm({
    initialValues: { title: '', description: '', duration: 15, active: true },
    validate: {
      title: (v) => (v.trim().length === 0 ? 'Title is required' : null),
      description: (v) => (v.trim().length === 0 ? 'Description is required' : null),
      duration: (v) => (v >= 5 && v <= 480 ? null : 'Between 5 and 480 minutes'),
    },
  });

  useEffect(() => {
    if (query.data) {
      form.setValues({
        title: query.data.title,
        description: query.data.description,
        duration: query.data.duration,
        active: query.data.active,
      });
      form.resetDirty({
        title: query.data.title,
        description: query.data.description,
        duration: query.data.duration,
        active: query.data.active,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: (values: typeof form.values) => updateEvent(slug, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: eventKeys.all });
      notifications.show({ color: 'green', message: 'Saved' });
    },
    onError: (err) => {
      notifications.show({ color: 'red', message: (err as Error).message });
    },
  });

  if (query.isLoading) return <Loader />;
  if (query.isError || !query.data) {
    return (
      <Alert color="red" title="Event not found">
        {(query.error as Error)?.message ?? ''}
      </Alert>
    );
  }

  const event = query.data;

  return (
    <Stack>
      <Group justify="space-between" align="center">
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            component={Link}
            to={routes.adminEventTypes}
            aria-label="Back to event types"
          >
            <IconArrowLeft size={18} />
          </ActionIcon>
          <Title order={3}>{event.title}</Title>
        </Group>
        <Group>
          <Switch
            checked={form.values.active}
            onChange={(e) => form.setFieldValue('active', e.currentTarget.checked)}
            label={form.values.active ? 'Visible' : 'Hidden'}
          />
          <Anchor href={routes.publicEvent(event.slug)} target="_blank" rel="noreferrer">
            <Group gap={4}>
              <IconExternalLink size={16} /> <Text size="sm">Preview</Text>
            </Group>
          </Anchor>
          <DeleteEventButton
            slug={event.slug}
            title={event.title}
            onDeleted={() => navigate(routes.adminEventTypes)}
          />
          <Button
            onClick={() => mutation.mutate(form.values)}
            loading={mutation.isPending}
            disabled={!form.isDirty() || !form.isValid()}
          >
            Save
          </Button>
        </Group>
      </Group>

      <Paper withBorder p="lg">
        <Stack>
          <TextInput label="Title" required {...form.getInputProps('title')} />
          <Textarea
            label="Description"
            autosize
            minRows={3}
            required
            {...form.getInputProps('description')}
          />
          <TextInput label="URL" value={`/${event.slug}`} readOnly disabled />
          <NumberInput
            label="Duration"
            suffix=" minutes"
            min={5}
            max={480}
            step={5}
            required
            {...form.getInputProps('duration')}
          />
        </Stack>
      </Paper>
    </Stack>
  );
}
