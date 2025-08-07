import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center space-y-8">
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-semibold text-gray-900 leading-tight">
              Property Inspections
              <br />
              <span className="text-gray-500">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Professional property inspections powered by AI. Capture photos, generate detailed reports, and streamline your workflow—all in one elegant platform.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Start Inspecting Today
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-4">
            Everything you need for professional inspections
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From photo capture to AI-powered analysis, our platform handles every aspect of property inspection workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900">Smart Photo Capture</h3>
            <p className="text-gray-600 leading-relaxed">
              Capture high-quality photos with your camera or upload from your device. Organized automatically by room and inspection type.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900">AI-Powered Analysis</h3>
            <p className="text-gray-600 leading-relaxed">
              Advanced AI automatically analyzes room conditions, identifies issues, and generates cleanliness scores with detailed descriptions.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900">Professional Reports</h3>
            <p className="text-gray-600 leading-relaxed">
              Generate comprehensive inspection reports with photos, analysis, and recommendations. Export and share with ease.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Simple workflow, powerful results
            </h2>
            <p className="text-lg text-gray-600">
              Complete professional property inspections in just a few steps
            </p>
          </div>

          <div className="space-y-12">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-lg flex items-center justify-center font-semibold text-lg">
                  1
                </div>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-medium text-gray-900 mb-2">Create Your Inspection</h3>
                <p className="text-gray-600 leading-relaxed">
                  Set up a new inspection with property details, inspection type (entry, exit, or routine), and select the rooms to inspect.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-lg flex items-center justify-center font-semibold text-lg">
                  2
                </div>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-medium text-gray-900 mb-2">Capture & Analyze</h3>
                <p className="text-gray-600 leading-relaxed">
                  Go through each room, take photos, and let our AI instantly analyze conditions, damage, and cleanliness levels.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-900 text-white rounded-lg flex items-center justify-center font-semibold text-lg">
                  3
                </div>
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xl font-medium text-gray-900 mb-2">Review & Complete</h3>
                <p className="text-gray-600 leading-relaxed">
                  Review AI analysis, add your notes, approve findings, and generate professional reports ready for clients.
                </p>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center mt-16">
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Get Started Now
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}