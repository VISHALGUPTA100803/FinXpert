import HeroSection from "@/components/hero";
import {
  featuresData,
  howItWorksData,
  statsData,
  testimonialsData,
} from "@/data/landing";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="mt-40">
      <HeroSection />
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8">
            {statsData.map((statsData, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {statsData.value}
                </div>
                <div className="text-gray-600"> {statsData.label} </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to manage your wealth
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresData.map((feature, index) => (
              <div key={index}>
                <Card className="p-6">
                  <CardContent className="space-y-4 pt-4">
                    {feature.icon}
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 bg-blue-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How it Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorksData.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {testimonialsData.map((testimonial, index) => (
              <div key={index} className="flex">
                <Card className="p-6 flex flex-col w-full">
                  <CardContent className="pt-4 flex flex-col flex-1">
                    {/* Avatar + Name + Role */}
                    <div className="flex items-center mb-4">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div className="ml-4">
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>

                    {/* Quote (pushes down if needed) */}
                    <p className="text-gray-600 flex-1">{testimonial.quote}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Take Charge of Your Financial Future Today
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Be part of the growing community that's reshaping money management
            with FinXpert.
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 animate-bounce"
            >
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

// If you just use container:

// The container will have a max width, but it will align left by default.

// If you add mx-auto:

// It tells the browser: "distribute the remaining horizontal space equally left & right" → center the container.

// text-center → aligns inline text and inline-block elements to the center of their container (horizontally).

// items-center

// Aligns children vertically (along the cross axis) in the center.

// Example: if flex direction is row (default), then it centers them top-to-bottom.

// justify-center

// Aligns children horizontally (along the main axis) in the center.

// Example: if flex direction is row, then it centers them left-to-right.

// Difference between text-center and items-center

// text-center → aligns inline content (text, inline elements) horizontally inside the container.
// Example: headings (h3), paragraphs (p), inline icons.

// items-center → works only with flex containers, aligning flex items vertically along the cross-axis (usually vertical if flex-row, horizontal if flex-col).

// .max-w-2xl {
//   max-width: 42rem; /* 672px */
// }
