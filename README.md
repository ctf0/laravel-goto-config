# Laravel Goto Config

- package by default search in `root/config` only

## Features

- direct scroll to config key

### Limitations

1. similar nested keys wont behave as expected, ex.

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
    - `config('messages.three)` will match the key under **one.two.three**

2. because of the previous issue, showing value on hover will give incorrect values
