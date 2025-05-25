// /var/www/bookmeatoz.online_ts/frontend/src/pages/public/ContactPage.tsx
import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import apiService from '@/services/apiService'; // Conceptual, may not be used if form is static
import { ApiErrorResponse } from '@/types';
import Spinner from '@/components/common/Spinner';
import toast from '@/utils/toast';

const contactFormSchema = z.object({
  name: z.string().min(2, "Name is too short").max(100, "Name is too long"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject is too short").max(150, "Subject is too long"),
  message: z.string().min(10, "Message is too short").max(2000, "Message is too long"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ContactPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    mode: "onBlur",
  });

  const onSubmit: SubmitHandler<ContactFormValues> = async (data) => {
    setServerError(null);
    setIsSubmitted(false);
    try {
      // Conceptual API call. Replace with actual endpoint if it exists.
      // For now, we'll simulate a successful submission.
      // const response = await apiService.post('/public/contact-submission', data);
      // if (response.data.success) {
      //   setIsSubmitted(true);
      //   reset();
      //   toast.success("Your message has been sent successfully! We'll get back to you soon.");
      // } else {
      //   setServerError(response.data.message || "Failed to send message.");
      //   toast.error(response.data.message || "Failed to send message.");
      // }

      // Simulate success for now
      console.log("Contact form submitted (simulated):", data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      setIsSubmitted(true);
      reset();
      toast.success("Your message has been received! We'll be in touch soon.");

    } catch (error) {
      const err = error as ApiErrorResponse;
      console.error("Contact form error:", err);
      setServerError(err.message || "An unexpected error occurred. Please try again.");
      toast.error(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="py-4 xs:py-6 sm:py-8 lg:py-12 bg-white rounded-xl shadow-lg p-3 xs:p-4 sm:p-6 md:p-10 mx-2 xs:mx-0">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <h1 className="text-2xl xs:text-3xl sm:text-3xl lg:text-4xl font-extrabold text-neutral-darkest mb-3 xs:mb-4 sm:mb-4 leading-tight">
            Get In Touch
          </h1>
          <p className="text-sm xs:text-base sm:text-lg text-neutral-dark max-w-2xl mx-auto mb-6 xs:mb-8 sm:mb-10 leading-relaxed px-2 xs:px-0">
            Have questions, feedback, or need support? We'd love to hear from you. Fill out the form below or reach out via our contact details.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6 sm:gap-8 lg:gap-10">
          {/* Contact Form */}
          <div className="bg-gray-50 p-3 xs:p-4 sm:p-6 lg:p-8 rounded-lg shadow-md">
            {isSubmitted ? (
              <div className="text-center py-6 xs:py-8 sm:py-10">
                <svg className="w-10 xs:w-12 sm:w-16 h-10 xs:h-12 sm:h-16 text-green-500 mx-auto mb-2 xs:mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-green-700">Message Sent!</h3>
                <p className="text-xs xs:text-sm sm:text-base text-neutral-dark mt-2">Thank you for contacting us. We'll respond as soon as possible.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 xs:space-y-4 sm:space-y-5">
                <h2 className="text-base xs:text-lg sm:text-xl font-semibold text-neutral-darkest mb-2 xs:mb-3 sm:mb-4">Send us a Message</h2>
                {serverError && <div role="alert" className="p-3 bg-red-100 text-red-700 rounded-md text-xs xs:text-sm">{serverError}</div>}
                
                <div>
                  <label htmlFor="name" className="block text-xs xs:text-sm font-medium text-gray-700">Full Name</label>
                  <input type="text" id="name" {...register("name")} disabled={isSubmitting} className={`mt-1 w-full p-2.5 border rounded-md shadow-sm text-sm touch-manipulation ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs xs:text-sm font-medium text-gray-700">Email Address</label>
                  <input type="email" id="email" {...register("email")} disabled={isSubmitting} className={`mt-1 w-full p-2.5 border rounded-md shadow-sm text-sm touch-manipulation ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>
                <div>
                  <label htmlFor="subject" className="block text-xs xs:text-sm font-medium text-gray-700">Subject</label>
                  <input type="text" id="subject" {...register("subject")} disabled={isSubmitting} className={`mt-1 w-full p-2.5 border rounded-md shadow-sm text-sm touch-manipulation ${errors.subject ? 'border-red-500' : 'border-gray-300'}`} />
                  {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
                </div>
                <div>
                  <label htmlFor="message" className="block text-xs xs:text-sm font-medium text-gray-700">Message</label>
                  <textarea id="message" {...register("message")} rows={5} disabled={isSubmitting} className={`mt-1 w-full p-2.5 border rounded-md shadow-sm text-sm touch-manipulation resize-none ${errors.message ? 'border-red-500' : 'border-gray-300'}`}></textarea>
                  {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
                </div>
                <div>
                  <button type="submit" disabled={isSubmitting} className="w-full btn btn-primary py-2.5 text-sm xs:text-base disabled:opacity-70 flex items-center justify-center min-h-[44px] touch-manipulation">
                    {isSubmitting ? <><Spinner color="text-white"/> Sending...</> : 'Send Message'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Contact Details */}
          <div className="space-y-4 xs:space-y-6 sm:space-y-6">
             <h2 className="text-lg xs:text-xl sm:text-xl font-semibold text-neutral-darkest mb-3 xs:mb-4 sm:mb-4">Contact Information</h2>
            <div>
              <h3 className="text-base xs:text-lg sm:text-lg font-medium text-gray-800">Email Us</h3>
              <p className="text-primary hover:underline mt-1 text-sm xs:text-base">
                <a href="mailto:support@bookmeatoz.online" className="touch-manipulation">support@bookmeatoz.online</a> (Placeholder)
              </p>
            </div>
            <div>
              <h3 className="text-base xs:text-lg sm:text-lg font-medium text-gray-800">Call Us</h3>
              <p className="text-primary hover:underline mt-1 text-sm xs:text-base">
                <a href="tel:+1234567890" className="touch-manipulation">+1 (234) 567-890</a> (Placeholder)
              </p>
            </div>
            <div>
              <h3 className="text-base xs:text-lg sm:text-lg font-medium text-gray-800">Our Office (Conceptual)</h3>
              <p className="text-neutral-dark mt-1 text-sm xs:text-base leading-relaxed">
                123 Booking Street<br />
                London, W1A 0AX<br />
                United Kingdom
              </p>
            </div>
             {/* Add a map embed here if desired */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
