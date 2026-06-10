'use client';

import { useState } from 'react';
import { Mail, Phone, Heart, Star, Sparkles } from 'lucide-react';
import {
  Button,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Badge,
  Input,
  Textarea,
  Select,
  Checkbox, Radio,
  Modal, ModalFooter,
  Accordion,
  Tabs,
  Carousel,
  useToast,
  LoadingSpinner, Skeleton, SkeletonCard, SkeletonText,
  Breadcrumb,
  Pagination,
} from '@/components/ui';

export default function ComponentsPreview() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { showToast, ToastContainer } = useToast();
  
  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];
  
  const accordionItems = [
    {
      id: '1',
      title: 'How do your services work?',
      content: 'Our services follow a clear process from consultation to delivery...',
    },
    {
      id: '2',
      title: 'How long does onboarding take?',
      content: 'Most customers can get started quickly with a streamlined setup process...',
    },
    {
      id: '3',
      title: 'Is it covered by insurance?',
      content: 'Coverage varies by provider and plan. Check with your provider for details...',
    },
  ];
  
  const tabs = [
    { id: 'tab1', label: 'Services', content: <div className="p-4 bg-gray-50 rounded-lg">Services content here...</div> },
    { id: 'tab2', label: 'Pricing', content: <div className="p-4 bg-gray-50 rounded-lg">Pricing content here...</div> },
    { id: 'tab3', label: 'Contact', content: <div className="p-4 bg-gray-50 rounded-lg">Contact content here...</div> },
  ];
  
  const carouselSlides = [
    <div key="1" className="bg-gradient-to-r from-primary to-primary-dark text-white p-12 text-center rounded-xl">
      <h3 className="text-3xl font-bold mb-2">Slide 1</h3>
      <p>Beautiful carousel slide</p>
    </div>,
    <div key="2" className="bg-gradient-to-r from-secondary to-secondary-dark text-white p-12 text-center rounded-xl">
      <h3 className="text-3xl font-bold mb-2">Slide 2</h3>
      <p>Another amazing slide</p>
    </div>,
    <div key="3" className="bg-gradient-to-r from-[var(--secondary)] to-[var(--secondary-dark)] text-white p-12 text-center rounded-xl">
      <h3 className="text-3xl font-bold mb-2">Slide 3</h3>
      <p>One more slide</p>
    </div>,
  ];
  
  const breadcrumbItems = [
    { label: 'Services', href: '/en/services' },
    { label: 'Featured Service', href: '/en/services' },
    { label: 'Details' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-display font-bold mb-4">UI Component Library</h1>
          <p className="text-lg text-gray-600">Phase 2: All 16 Components Showcase</p>
          <Badge variant="success" className="mt-4">Phase 2 Complete ✓</Badge>
        </div>
        
        <div className="space-y-12">
          {/* Buttons */}
          <section>
            <h2 className="text-heading font-bold mb-6">Buttons</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button loading>Loading...</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </section>
          
          {/* Cards */}
          <section>
            <h2 className="text-heading font-bold mb-6">Cards</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card variant="default">
                <CardHeader>
                  <CardTitle>Default Card</CardTitle>
                  <CardDescription>This is a card description</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">Card content goes here...</p>
                </CardContent>
                <CardFooter>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </Card>
              
              <Card variant="bordered" hover>
                <CardHeader>
                  <CardTitle>Bordered Card</CardTitle>
                  <CardDescription>With hover effect</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">Hover over me!</p>
                </CardContent>
              </Card>
              
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Elevated Card</CardTitle>
                  <CardDescription>With shadow</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">More elevation</p>
                </CardContent>
              </Card>
            </div>
          </section>
          
          {/* Badges */}
          <section>
            <h2 className="text-heading font-bold mb-6">Badges</h2>
            <div className="flex flex-wrap gap-3">
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
              <Badge size="lg">Large</Badge>
            </div>
          </section>
          
          {/* Form Inputs */}
          <section>
            <h2 className="text-heading font-bold mb-6">Form Inputs</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
              <Input
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                icon={<Mail size={20} />}
              />
              
              <Input
                label="Phone Number"
                type="tel"
                placeholder="(555) 123-4567"
                icon={<Phone size={20} />}
              />
              
              <Textarea
                label="Message"
                placeholder="Your message here..."
                helperText="Maximum 500 characters"
              />
              
              <Select
                label="Select an option"
                options={selectOptions}
                placeholder="Choose..."
              />
              
              <div className="space-y-3">
                <Checkbox label="I agree to the terms and conditions" />
                <Checkbox label="Subscribe to newsletter" />
              </div>
              
              <div className="space-y-3">
                <Radio name="plan" label="Basic Plan" />
                <Radio name="plan" label="Pro Plan" />
                <Radio name="plan" label="Enterprise Plan" />
              </div>
            </div>
          </section>
          
          {/* Modal */}
          <section>
            <h2 className="text-heading font-bold mb-6">Modal</h2>
            <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
            
            <Modal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Example Modal"
              description="This is a modal dialog"
            >
              <p className="text-gray-700">
                This is the modal content. You can put anything here!
              </p>
              
              <ModalFooter>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setModalOpen(false)}>
                  Confirm
                </Button>
              </ModalFooter>
            </Modal>
          </section>
          
          {/* Accordion */}
          <section>
            <h2 className="text-heading font-bold mb-6">Accordion (FAQ)</h2>
            <Accordion items={accordionItems} defaultOpen="1" />
          </section>
          
          {/* Tabs */}
          <section>
            <h2 className="text-heading font-bold mb-6">Tabs</h2>
            <Tabs tabs={tabs} variant="default" />
            <div className="mt-6">
              <Tabs tabs={tabs} variant="pills" />
            </div>
          </section>
          
          {/* Carousel */}
          <section>
            <h2 className="text-heading font-bold mb-6">Carousel</h2>
            <Carousel autoPlay interval={3000}>
              {carouselSlides}
            </Carousel>
          </section>
          
          {/* Toast */}
          <section>
            <h2 className="text-heading font-bold mb-6">Toast Notifications</h2>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => showToast({ message: 'Success!', type: 'success' })}>
                Success Toast
              </Button>
              <Button onClick={() => showToast({ message: 'Error occurred', type: 'error' })}>
                Error Toast
              </Button>
              <Button onClick={() => showToast({ message: 'Warning!', type: 'warning' })}>
                Warning Toast
              </Button>
              <Button onClick={() => showToast({ message: 'Info message', type: 'info' })}>
                Info Toast
              </Button>
            </div>
          </section>
          
          {/* Loading States */}
          <section>
            <h2 className="text-heading font-bold mb-6">Loading States</h2>
            <div className="space-y-6">
              <div className="flex gap-6 items-center">
                <LoadingSpinner size="sm" />
                <LoadingSpinner size="md" />
                <LoadingSpinner size="lg" />
                <LoadingSpinner size="xl" />
              </div>
              
              <div className="space-y-4 max-w-md">
                <Skeleton height={40} />
                <SkeletonText lines={3} />
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <SkeletonCard />
              </div>
            </div>
          </section>
          
          {/* Breadcrumb */}
          <section>
            <h2 className="text-heading font-bold mb-6">Breadcrumb</h2>
            <Breadcrumb items={breadcrumbItems} />
          </section>
          
          {/* Pagination */}
          <section>
            <h2 className="text-heading font-bold mb-6">Pagination</h2>
            <Pagination
              currentPage={currentPage}
              totalPages={10}
              onPageChange={setCurrentPage}
            />
            <p className="mt-4 text-center text-gray-600">Current Page: {currentPage}</p>
          </section>
          
          {/* Icons Showcase */}
          <section>
            <h2 className="text-heading font-bold mb-6">Icons (Lucide React)</h2>
            <div className="flex gap-6 items-center">
              <Heart size={24} className="text-red-500" />
              <Star size={24} className="text-[var(--secondary)]" />
              <Sparkles size={24} className="text-[var(--secondary-dark)]" />
              <Mail size={24} className="text-gray-700" />
              <Phone size={24} className="text-[var(--secondary)]" />
            </div>
          </section>
        </div>
        
        {/* Footer Note */}
        <div className="mt-16 text-center text-gray-600">
          <p className="text-lg font-semibold mb-2">🎉 Phase 2 Complete!</p>
          <p>All 16 UI components are ready to use</p>
          <p className="mt-4">
            <Badge variant="primary">Next: Phase 3 - Complete Homepage</Badge>
          </p>
        </div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
