import AppLayout from '@/components/layout/AppLayout'
import InspectionForm from '@/components/inspections/InspectionForm'

export default function NewInspectionPage() {
  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <InspectionForm />
      </div>
    </AppLayout>
  )
}