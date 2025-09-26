"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, FileText, User, Dog, Syringe } from "lucide-react"
import { sanitizeUSPhone, coerceDate, isWithinYears, parseNumberSafe, isPositiveNumber } from "@/lib/utils"

const createDogLicenseSchema = () => {
  const baseSchema = {
    ownerName: z
      .string()
      .min(2, "Owner name must be at least 2 characters")
      .max(100, "Owner name must be less than 100 characters"),

    ownerAddress: z
      .string()
      .min(10, "Please provide a complete address")
      .max(200, "Address must be less than 200 characters"),

    ownerPhone: z.string().refine((val) => {
      const result = sanitizeUSPhone(val)
      return result.ok
    }, "Please enter a valid US phone number"),

    dogName: z.string().min(1, "Dog name is required").max(50, "Dog name must be less than 50 characters"),

    dogBreed: z.string().min(1, "Dog breed is required").max(50, "Dog breed must be less than 50 characters"),

    dogAge: z.string().refine((val) => {
      const num = parseNumberSafe(val)
      return num !== null && isPositiveNumber(num) && num <= 30
    }, "Dog age must be a positive number (max 30 years)"),

    dogColor: z.string().min(1, "Dog color is required").max(30, "Dog color must be less than 30 characters"),

    lastRabiesShotDate: z
      .string()
      .refine((val) => {
        const date = coerceDate(val)
        return date !== null
      }, "Please enter a valid date")
      .refine((val) => {
        const date = coerceDate(val)
        return date && isWithinYears(date, 3)
      }, "Rabies vaccination must be within the last 3 years"),
  }

  // Only add FileList validation on client side
  if (typeof window !== "undefined" && typeof FileList !== "undefined") {
    return z.object({
      ...baseSchema,
      vaccinationCertificate: z
        .instanceof(FileList)
        .refine((files) => files.length > 0, "Vaccination certificate is required")
        .refine((files) => {
          const file = files[0]
          return file && file.size <= 5 * 1024 * 1024 // 5MB limit
        }, "File size must be less than 5MB")
        .refine((files) => {
          const file = files[0]
          const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
          return file && allowedTypes.includes(file.type)
        }, "File must be PDF, JPEG, or PNG format"),
    })
  } else {
    // Server-side fallback - use any() for file field
    return z.object({
      ...baseSchema,
      vaccinationCertificate: z.any().optional(),
    })
  }
}

type DogLicenseFormData = z.infer<ReturnType<typeof createDogLicenseSchema>>

const STEPS = [
  { id: 1, title: "Owner Information", icon: User, description: "Your personal details" },
  { id: 2, title: "Dog Information", icon: Dog, description: "About your dog" },
  { id: 3, title: "Vaccination Records", icon: Syringe, description: "Health documentation" },
  { id: 4, title: "Review & Submit", icon: FileText, description: "Confirm your application" },
]

export default function NewApplication() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isClient, setIsClient] = useState(false)
  const [dogLicenseSchema, setDogLicenseSchema] = useState(() => createDogLicenseSchema())

  const form = useForm<DogLicenseFormData>({
    resolver: zodResolver(dogLicenseSchema),
    defaultValues: {
      ownerName: "",
      ownerAddress: "",
      ownerPhone: "",
      dogName: "",
      dogBreed: "",
      dogAge: "",
      dogColor: "",
      lastRabiesShotDate: "",
    },
    mode: "onChange",
  })

  useEffect(() => {
    setIsClient(true)
    setDogLicenseSchema(createDogLicenseSchema())
  }, [])

  useEffect(() => {
    if (isClient) {
      form.clearErrors()
    }
  }, [isClient])

  useEffect(() => {
    if (isClient) {
      const savedData = localStorage.getItem("dogLicenseFormData")
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData)
          form.reset(parsedData)
          toast.info("Previous form data restored")
        } catch (error) {
          console.error("Error loading saved form data:", error)
        }
      }
    }
  }, [isClient, form])

  const watchedValues = form.watch()
  useEffect(() => {
    if (isClient) {
      const dataToSave = { ...watchedValues }
      delete dataToSave.vaccinationCertificate // Don't save file data
      localStorage.setItem("dogLicenseFormData", JSON.stringify(dataToSave))
    }
  }, [watchedValues, isClient])

  const generateApplicationId = (): string => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 10000)
    return `DOG-${timestamp}-${random}`
  }

  const onSubmit = async (data: DogLicenseFormData) => {
    if (!isClient) return

    try {
      const applicationId = generateApplicationId()

      const applicationData = {
        id: applicationId,
        ...data,
        submittedAt: new Date().toISOString(),
        status: "submitted",
      }

      // Save to applications list
      const existingApps = JSON.parse(localStorage.getItem("dogLicenseApplications") || "[]")
      existingApps.push(applicationData)
      localStorage.setItem("dogLicenseApplications", JSON.stringify(existingApps))

      // Clear form data
      localStorage.removeItem("dogLicenseFormData")

      toast.success(`Application submitted successfully! Your application ID is: ${applicationId}`)

      // Reset form and redirect to tracking page
      form.reset()
      setCurrentStep(1)

      setTimeout(() => {
        window.location.href = `/track-application?id=${applicationId}`
      }, 2000)
    } catch (error) {
      console.error("Error submitting application:", error)
      toast.error("Failed to submit application. Please try again.")
    }
  }

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep)
    const isValid = await form.trigger(fieldsToValidate)

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    } else {
      toast.error("Please fix the errors before continuing")
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const getFieldsForStep = (step: number): (keyof DogLicenseFormData)[] => {
    switch (step) {
      case 1:
        return ["ownerName", "ownerAddress", "ownerPhone"]
      case 2:
        return ["dogName", "dogBreed", "dogAge", "dogColor"]
      case 3:
        return ["lastRabiesShotDate", "vaccinationCertificate"]
      default:
        return []
    }
  }

  const progress = (currentStep / STEPS.length) * 100

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Loading Application Form...</h1>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Dog License Application</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">Complete all steps to register your dog</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Step {currentStep} of {STEPS.length}
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8">
          {STEPS.map((step) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2
                  ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }
                `}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-xs text-center max-w-20 ${
                    isActive ? "text-blue-600 font-medium" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            )
          })}
        </div>

        {/* Form */}
        <Card className="bg-white dark:bg-gray-800 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(STEPS[currentStep - 1].icon, { className: "w-5 h-5" })}
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Owner Information */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="ownerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormDescription>Your legal name as it appears on official documents</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ownerAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Residential Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your complete address" {...field} />
                          </FormControl>
                          <FormDescription>Include street address, city, state, and ZIP code</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ownerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormDescription>10-digit US phone number for contact purposes</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Dog Information */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="dogName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dog's Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your dog's name" {...field} />
                          </FormControl>
                          <FormDescription>The name you use to call your dog</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dogBreed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Breed *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Golden Retriever, Mixed Breed" {...field} />
                          </FormControl>
                          <FormDescription>Primary breed or "Mixed Breed" if unknown</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dogAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age (in years) *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 3" min="0" max="30" {...field} />
                          </FormControl>
                          <FormDescription>Your dog's age in years (approximate is fine)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dogColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Brown, Black, Golden" {...field} />
                          </FormControl>
                          <FormDescription>Main color of your dog's coat</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 3: Vaccination Records */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="lastRabiesShotDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Rabies Vaccination Date *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormDescription>Must be within the last 3 years</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vaccinationCertificate"
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormItem>
                          <FormLabel>Vaccination Certificate *</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => onChange(e.target.files)}
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Upload PDF or image file (max 5MB). Must show current rabies vaccination.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 4: Review & Submit */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="font-semibold mb-4">Review Your Application</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Owner Name:</strong> {form.getValues("ownerName")}
                        </div>
                        <div>
                          <strong>Phone:</strong> {form.getValues("ownerPhone")}
                        </div>
                        <div className="md:col-span-2">
                          <strong>Address:</strong> {form.getValues("ownerAddress")}
                        </div>
                        <div>
                          <strong>Dog Name:</strong> {form.getValues("dogName")}
                        </div>
                        <div>
                          <strong>Breed:</strong> {form.getValues("dogBreed")}
                        </div>
                        <div>
                          <strong>Age:</strong> {form.getValues("dogAge")} years
                        </div>
                        <div>
                          <strong>Color:</strong> {form.getValues("dogColor")}
                        </div>
                        <div className="md:col-span-2">
                          <strong>Last Rabies Shot:</strong> {form.getValues("lastRabiesShotDate")}
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        By submitting this application, you confirm that all information provided is accurate and
                        complete. You will receive an application ID for tracking purposes.
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  {currentStep < STEPS.length ? (
                    <Button type="button" onClick={nextStep} className="flex items-center gap-2">
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button type="submit" className="flex items-center gap-2" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Submitting..." : "Submit Application"}
                      <FileText className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
