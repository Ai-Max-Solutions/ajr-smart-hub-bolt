import * as React from "react"
import { useForm, FieldValues, Path } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { EnhancedInput } from "@/components/ui/enhanced-input"
import { EnhancedSelect, SelectOption } from "@/components/ui/enhanced-select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, Save, X } from "lucide-react"
import { format } from "date-fns"

export type FieldType = 
  | "text" 
  | "email" 
  | "password" 
  | "number" 
  | "tel"
  | "url"
  | "search"
  | "textarea" 
  | "select" 
  | "multiselect"
  | "switch" 
  | "date"
  | "datetime"

export interface FormFieldConfig<T extends FieldValues = FieldValues> {
  name: Path<T>
  label: string
  type: FieldType
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  options?: SelectOption[] // For select fields
  validation?: z.ZodTypeAny
  className?: string
  icon?: React.ReactNode
  rows?: number // For textarea
  grid?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
  }
}

export interface FormBuilderProps<T extends FieldValues = FieldValues> {
  title?: string
  description?: string
  fields: FormFieldConfig<T>[]
  defaultValues?: Partial<T>
  schema?: z.ZodSchema<T>
  onSubmit: (data: T) => Promise<void> | void
  onCancel?: () => void
  submitText?: string
  cancelText?: string
  loading?: boolean
  className?: string
  gridCols?: number
}

export function FormBuilder<T extends FieldValues = FieldValues>({
  title,
  description,
  fields,
  defaultValues,
  schema,
  onSubmit,
  onCancel,
  submitText = "Save",
  cancelText = "Cancel",
  loading = false,
  className,
  gridCols = 2
}: FormBuilderProps<T>) {
  const form = useForm<T>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: defaultValues as any,
  })

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (data: T) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getGridClass = (field: FormFieldConfig<T>) => {
    const { grid } = field
    if (!grid) return ""
    
    const classes = []
    if (grid.xs) classes.push(`col-span-${grid.xs}`)
    if (grid.sm) classes.push(`sm:col-span-${grid.sm}`)
    if (grid.md) classes.push(`md:col-span-${grid.md}`)
    if (grid.lg) classes.push(`lg:col-span-${grid.lg}`)
    
    return classes.join(" ")
  }

  const renderField = (field: FormFieldConfig<T>) => {
    return (
      <FormField
        key={field.name}
        control={form.control}
        name={field.name}
        render={({ field: formField, fieldState }) => (
          <FormItem className={cn(getGridClass(field), field.className)}>
            <FormLabel className="font-poppins font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
            <FormControl>
              {(() => {
                switch (field.type) {
                  case "text":
                  case "email":
                  case "password":
                  case "number":
                  case "tel":
                  case "url":
                    return (
                      <EnhancedInput
                        type={field.type}
                        placeholder={field.placeholder}
                        disabled={field.disabled || loading}
                        icon={field.icon}
                        error={fieldState.error?.message}
                        variant={field.type === "password" ? "password" : "default"}
                        {...formField}
                      />
                    )
                  
                  case "search":
                    return (
                      <EnhancedInput
                        type="text"
                        placeholder={field.placeholder}
                        disabled={field.disabled || loading}
                        icon={field.icon}
                        error={fieldState.error?.message}
                        variant="search"
                        {...formField}
                      />
                    )

                  case "textarea":
                    return (
                      <Textarea
                        placeholder={field.placeholder}
                        disabled={field.disabled || loading}
                        rows={field.rows || 3}
                        className={cn(
                          "resize-none font-poppins",
                          fieldState.error && "border-destructive focus-visible:ring-destructive"
                        )}
                        {...formField}
                      />
                    )

                  case "select":
                    return (
                      <EnhancedSelect
                        options={field.options || []}
                        value={formField.value}
                        onValueChange={formField.onChange}
                        placeholder={field.placeholder}
                        disabled={field.disabled || loading}
                        error={fieldState.error?.message}
                        clearable
                      />
                    )

                  case "multiselect":
                    return (
                      <EnhancedSelect
                        options={field.options || []}
                        value={formField.value}
                        onValueChange={formField.onChange}
                        placeholder={field.placeholder}
                        disabled={field.disabled || loading}
                        error={fieldState.error?.message}
                        multiple
                        clearable
                      />
                    )

                  case "switch":
                    return (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formField.value}
                          onCheckedChange={formField.onChange}
                          disabled={field.disabled || loading}
                        />
                        <span className="text-sm text-muted-foreground">
                          {formField.value ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    )

                  case "date":
                  case "datetime":
                    return (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-12",
                              !formField.value && "text-muted-foreground",
                              fieldState.error && "border-destructive focus-visible:ring-destructive"
                            )}
                            disabled={field.disabled || loading}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formField.value ? (
                              format(new Date(formField.value), field.type === "datetime" ? "PPP p" : "PPP")
                            ) : (
                              <span>{field.placeholder || "Pick a date"}</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                          <Calendar
                            mode="single"
                            selected={formField.value ? new Date(formField.value) : undefined}
                            onSelect={(date) => formField.onChange(date?.toISOString())}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    )

                  default:
                    return (
                      <EnhancedInput
                        type="text"
                        placeholder={field.placeholder}
                        disabled={field.disabled || loading}
                        icon={field.icon}
                        error={fieldState.error?.message}
                        {...formField}
                      />
                    )
                }
              })()}
            </FormControl>
            {field.description && (
              <FormDescription className="font-poppins text-muted-foreground">
                {field.description}
              </FormDescription>
            )}
            <FormMessage className="font-poppins" />
          </FormItem>
        )}
      />
    )
  }

  return (
    <Card className={cn("w-full max-w-4xl", className)}>
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle className="font-poppins text-xl">{title}</CardTitle>
          )}
          {description && (
            <p className="text-muted-foreground font-poppins">{description}</p>
          )}
        </CardHeader>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent>
            <div className={cn(
              "grid gap-6",
              gridCols && `grid-cols-1 md:grid-cols-${gridCols}`
            )}>
              {fields.map(renderField)}
            </div>
          </CardContent>
          
          <CardFooter className="flex gap-3 justify-end border-t pt-6">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting || loading}
                className="font-poppins"
              >
                <X className="w-4 h-4 mr-2" />
                {cancelText}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || loading}
              className="font-poppins min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {submitText}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}