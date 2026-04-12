import { Modal, TextInput, Button, Group, Text, Stack } from '@mantine/core';
import { useState } from 'react';

interface LoginPromptProps {
  opened: boolean;
  onClose: () => void;
  onLogin: (username: string, password: string) => void;
}

export function LoginPrompt({ opened, onClose, onLogin }: LoginPromptProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
    setUsername('');
    setPassword('');
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Требуется авторизация" centered>
      <form onSubmit={handleSubmit}>
        <Stack>
          <Text size="sm" c="dimmed">
            Введите логин и пароль для доступа к панели администратора
          </Text>
          <TextInput
            label="Логин"
            placeholder="admin"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            required
          />
          <TextInput
            label="Пароль"
            type="password"
            placeholder="••••••"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" color="blue">
              Войти
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
