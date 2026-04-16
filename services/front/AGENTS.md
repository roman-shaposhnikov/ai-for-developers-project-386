## Structure

```
- dal                     # слой работы с данными и запросов по api, тут DataSources + Repositories
- core                    # бизнес логика и доменные сущности
- ui                      # ui организованный по FSD
    - app                 # корневой компонент для 
    - pages               # готовые страницы
    - widgets             # готовые независимые блоки, состоящие из фичей
    - features            # ui под конкретные фичи
        - example         # пример слайса для компонента
            - ui          # view компонента
            - model       # view-model компонента
            - index.ts    # публичный api
    - entities
    - shared
```

**Направление зависимостей:**

```
app -> pages -> widgets -> features -> entities -> shared
```

