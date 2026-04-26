import { Modal, Stack, TextInput, Textarea, NumberInput, Group, Button, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCreateEvent } from './model';

interface Props {
  opened: boolean;
  onClose: () => void;
  onCreated?: (slug: string) => void;
}

const SLUG_RE = /^[a-z][a-z0-9-]*$/;

export function CreateEventModal({ opened, onClose, onCreated }: Props) {
  const mutation = useCreateEvent();

  const form = useForm({
    initialValues: {
      title: '',
      slug: '',
      description: '',
      duration: 15,
    },
    validate: {
      title: (v) => (v.trim().length === 0 ? 'Title is required' : null),
      slug: (v) =>
        SLUG_RE.test(v) ? null : 'Lowercase letters, digits, dashes; starts with a letter',
      description: (v) => (v.trim().length === 0 ? 'Description is required' : null),
      duration: (v) => (v >= 5 && v <= 480 ? null : 'Between 5 and 480 minutes'),
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    mutation.mutate(values, {
      onSuccess: (event) => {
        notifications.show({ color: 'green', message: `Event "${event.title}" created` });
        form.reset();
        onCreated?.(event.slug);
        onClose();
      },
      onError: (err) => {
        notifications.show({ color: 'red', message: (err as Error).message });
      },
    });
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Add a new event type" centered size="lg">
      <Text size="sm" c="dimmed" mb="md">
        Set up event types to offer different types of meetings.
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="Title"
            placeholder="Quick chat"
            required
            {...form.getInputProps('title')}
          />
          <TextInput
            label="URL"
            description="Lowercase letters, digits and dashes; starts with a letter."
            placeholder="quick-chat"
            required
            {...form.getInputProps('slug')}
          />
          <Textarea
            label="Description"
            placeholder="A quick video meeting."
            autosize
            minRows={3}
            required
            {...form.getInputProps('description')}
          />
          <NumberInput
            label="Duration"
            suffix=" minutes"
            min={5}
            max={480}
            step={5}
            required
            {...form.getInputProps('duration')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose} disabled={mutation.isPending}>
              Close
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Continue
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
