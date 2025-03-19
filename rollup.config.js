export default {
    input: {
        app: 'src/application.js', // main entry point
        provider: 'src/providers/AppServiceProvider.js', // entry point for the AppServiceProvider
        // Add more entry points for other providers as needed
    },
    output: [
        {
          dir: 'dist',
          format: 'esm', // You can change the format based on your needs (e.g., cjs, esm)
          entryFileNames: '[name].js', // Use the name of the entry point for the output file
        },
    ],
};