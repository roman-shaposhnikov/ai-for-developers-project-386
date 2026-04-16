## Overview

## Structure

```
- Makefile
- api                  # API контракт между бэкендом и фронтендом
- services
    - back
    - front
- e2e
- docs
- prompts
- config
```

## Test

```bash
make test         # все тесты
make test-u       # юнит-тесты
make test-i       # интеграционные-тесты
make test-e       # e2e-тесты
```

## Dev

```bash
make dev
make dev-front
make dev-back
```

