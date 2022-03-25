# Laravel Goto Config

- package by default search in `root/config` only, blame laravel for not having vendors for config as `lang & view`

## Features

- direct scroll to config key
- add key to clipboard if not found in file
- showing value on hover `laravel/tinker must be installed`
- support configuring the php executable

### Limitations

- similar nested keys wont behave as expected, ex.

    ```php
    // messages.php
    [
        'one' => [
            'two' => [
                'three' => 'some value'
            ]
        ],
        'two' => [
            'three' => 'some value'
        ]
    ];
    ```

    - `config('messages.one.two.three)` will match correctly
    - `config('messages.two.three)` will match the keys under **one.two.three**
