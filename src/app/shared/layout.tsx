export default function SharedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <title>Shared Inspection Report</title>
      </head>
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  )
}