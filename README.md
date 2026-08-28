# go-ctor-gen

Generates a `New{StructName}` constructor for a Go struct, with fields and parameters filled in automatically — no typing required.

## Features

Place your cursor inside a Go struct and run the command (or use the keybinding) to insert a constructor directly below it.

Only exported fields are included, since unexported fields can't be set from outside the package.

**Example** — given:

```go
type Server struct {
	Host string
	Port int
	tls  bool
}
```

Running the command inserts:

```go
func NewServer(host string, port int) *Server {
	return &Server{Host: host, Port: port}
}
```

## Usage

- Command Palette: `Generate Go Constructor`
- Keybinding: `Ctrl+Alt+N` (when a `.go` file is focused)

## Requirements

None — no dependencies, no configuration.

## Known Issues

- Uses regex-based parsing rather than a full Go AST, so it may not handle every struct layout correctly (e.g. multiple field names declared on one line, like `X, Y int`, or embedded/anonymous fields).
- Always appends a new constructor below the struct; it does not detect or overwrite an existing one.

## Release Notes

### 0.0.1

Initial release — generates a basic `New{Name}` constructor for exported struct fields.