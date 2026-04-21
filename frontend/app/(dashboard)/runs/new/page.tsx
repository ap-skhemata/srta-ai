'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PlayCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { createRun } from '@/lib/api'

const regions = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
]

export default function NewRunPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    tenant: '',
    region: '',
    problem_description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const run = await createRun(formData)
      router.push(`/runs/${run.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = formData.tenant && formData.region && formData.problem_description

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/runs">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to runs</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create New Run</h1>
          <p className="text-muted-foreground">
            Start a new Skhemata Runtime Triage Agent run
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
          <CardDescription>
            Provide information about the incident you want to investigate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="tenant">Tenant</FieldLabel>
                <Input
                  id="tenant"
                  placeholder="e.g., acme-corp"
                  value={formData.tenant}
                  onChange={(e) => setFormData({ ...formData, tenant: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  The tenant or organization experiencing the issue
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="region">Region</FieldLabel>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger id="region">
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  The runtime region where the incident is occurring
                </p>
              </Field>

              <Field>
                <FieldLabel htmlFor="problem">Problem Description</FieldLabel>
                <Textarea
                  id="problem"
                  placeholder="Describe the incident in detail. Include any relevant metrics, error messages, or symptoms you've observed..."
                  className="min-h-[150px]"
                  value={formData.problem_description}
                  onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Be as specific as possible. The agent will use this to guide its investigation.
                </p>
              </Field>
            </FieldGroup>

            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
              <Button variant="outline" type="button" asChild>
                <Link href="/runs">Cancel</Link>
              </Button>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Triage
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Tips for effective triage</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Include specific metrics or thresholds that are being breached</p>
          <p>• Mention the affected services or components</p>
          <p>• Note when the issue started or any recent changes</p>
          <p>• Add any error messages or log excerpts if available</p>
        </CardContent>
      </Card>
    </div>
  )
}
