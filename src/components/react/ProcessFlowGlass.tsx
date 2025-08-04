import React from 'react';
import { Search, FileText, Palette, Rocket } from 'lucide-react';

// TypeScript interfaces for better type safety
interface ProcessStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface ProcessCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

// Individual "Glass" card component for each step in the process
const ProcessCard: React.FC<ProcessCardProps> = ({ icon, title, description }) => {
  return (
    <div className="
      group
      p-8
      rounded-3xl
      border border-light-border/20 dark:border-dark-border/20
      bg-light-secondary/50 dark:bg-dark-secondary/50
      backdrop-blur-xl
      shadow-2xl shadow-black/5 dark:shadow-black/40
      transform transition-all duration-300
      hover:-translate-y-2
      hover:shadow-light-accent/10 dark:hover:shadow-dark-accent/10
      flex flex-col items-start
    ">
      {/* Icon container */}
      <div className="
        p-4
        rounded-2xl
        mb-6
        bg-light-primary/10 dark:bg-dark-primary/10
        border border-light-border/20 dark:border-dark-border/20
        transition-all duration-300
        group-hover:bg-light-accent/20 dark:group-hover:bg-dark-accent/20
        group-hover:border-light-accent/30 dark:group-hover:border-dark-accent/30
      ">
        <div className="text-text-light-secondary dark:text-text-dark-secondary group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors duration-300">
          {icon}
        </div>
      </div>

      {/* Text content */}
      <h3 className="text-2xl font-semibold text-text-light-primary dark:text-text-dark-primary mb-3 sf-semibold">
        {title}
      </h3>
      <p className="text-text-light-secondary dark:text-text-dark-secondary leading-relaxed sf-regular">
        {description}
      </p>
    </div>
  );
};

// Main component that renders the glass morphism process section
const ProcessFlowGlass: React.FC = () => {
  // Data for the process steps. This makes it easy to add, remove, or change steps.
  const processSteps: ProcessStep[] = [
    {
      icon: <Search size={40} />,
      title: '01. Discover',
      description: 'We start by diving deep into your brand, goals, and target audience to lay a solid foundation for success.',
    },
    {
      icon: <FileText size={40} />,
      title: '02. Define',
      description: 'Next, we craft a detailed strategy and project roadmap, defining key milestones and deliverables.',
    },
    {
      icon: <Palette size={40} />,
      title: '03. Design',
      description: 'Our creative team brings the vision to life with stunning, user-centric designs that captivate and convert.',
    },
    {
      icon: <Rocket size={40} />,
      title: '04. Deploy',
      description: 'We finish with a seamless launch, followed by ongoing support to ensure your project thrives.',
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Grid container for the process cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {processSteps.map((step, index) => (
          <ProcessCard
            key={index}
            icon={step.icon}
            title={step.title}
            description={step.description}
          />
        ))}
      </div>
    </div>
  );
};

export default ProcessFlowGlass;
