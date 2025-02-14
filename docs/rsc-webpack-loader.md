# RSC Webpack Loader

The RSC (React Server Components) Webpack loader is used to convert the server bundle into a React Server Components bundle (RSC Bundle). It removes the client components from the bundle and replace them with client references.

The following is an implementation details and you don't need to know it to use RSC.

## How It Works

It replaces all exports in client component file with a reference to the client component.

For example, if you have a file `components/ClientComponent.js`:

```jsx
export default function ClientComponent() {
  return <div>Hello from client</div>;
}
```

It will be replaced with:

```jsx
export default function ClientComponent() {
  return <div>Hello from client</div>;
}
```

