import React, { useState, useEffect } from 'react';

interface ProcessStep {
  number: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  iconColor: string;
}

interface ProcessFlowProps {
  className?: string;
  animationDelay?: number;
}

const ProcessFlow: React.FC<ProcessFlowProps> = ({ 
  className = "",
  animationDelay = 0 
}) => {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const processSteps: ProcessStep[] = [
    {
      number: "01",
      title: "Market Assessment",
      description: "Conduct thorough market research to understand the competitive landscape.",
      color: "#E91E63",
      bgColor: "#FCE4EC",
      iconColor: "#E91E63"
    },
    {
      number: "02",
      title: "Set Business Goals",
      description: "Define clear, measurable business and marketing objectives to guide strategy.",
      color: "#FF9800",
      bgColor: "#FFF3E0",
      iconColor: "#FF9800"
    },
    {
      number: "03",
      title: "Develop Strategy",
      description: "Create a strategic plan to meet business goals, focusing on key marketing initiatives.",
      color: "#FFC107",
      bgColor: "#FFFDE7",
      iconColor: "#FFC107"
    },
    {
      number: "04",
      title: "Campaign Execution",
      description: "Implement targeted marketing campaigns across relevant channels.",
      color: "#4CAF50",
      bgColor: "#E8F5E8",
      iconColor: "#4CAF50"
    },
    {
      number: "05",
      title: "Evaluation & Feedback",
      description: "Analyze campaign results and gather feedback to improve future strategies.",
      color: "#9C27B0",
      bgColor: "#F3E5F5",
      iconColor: "#9C27B0"
    }
  ];

  const iconSvgs: Record<string, string> = {
    "01": "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
    "02": "M15.042 21.672L13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59",
    "03": "M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.228a9.208 9.208 0 012.16-.22c.493 0 .982.018 1.467.055M16.5 6.228a8.496 8.496 0 01-2.485 5.507m-6.263-3.078a8.496 8.496 0 002.263 5.056c.344.235.706.43 1.083.594M12 15.75a3 3 0 103-3 3 3 0 00-3 3zm0 0v1.5",
    "04": "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
    "05": "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, animationDelay);

    return () => clearTimeout(timer);
  }, [animationDelay]);

  const handleStepHover = (index: number) => {
    setActiveStep(index);
  };

  const handleStepLeave = () => {
    setActiveStep(null);
  };

  return (
    <div className={`process-flow-container ${className}`}>
      <div 
        className={`process-steps ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'center',
          alignItems: 'flex-start',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 1rem'
        }}
      >
        {processSteps.map((step, index) => (
          <div 
            key={step.number}
            className="process-step-wrapper"
            style={{
              position: 'relative',
              flex: '1',
              minWidth: '200px',
              maxWidth: '240px',
              transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: `all 0.6s ease ${index * 0.1}s`
            }}
            onMouseEnter={() => handleStepHover(index)}
            onMouseLeave={handleStepLeave}
          >
            {/* Connection line (except for last item) */}
            {index < processSteps.length - 1 && (
              <div 
                className="connection-line"
                style={{
                  position: 'absolute',
                  top: '30px',
                  right: '-0.5rem',
                  width: '1rem',
                  height: '2px',
                  background: 'linear-gradient(to right, #E0E0E0, #BDBDBD)',
                  zIndex: 1
                }}
              />
            )}
            
            <div className="process-step" style={{ position: 'relative', zIndex: 2 }}>
              {/* Colored circle with number */}
              <div 
                className="step-circle"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  backgroundColor: step.color,
                  boxShadow: activeStep === index 
                    ? `0 8px 25px ${step.color}40` 
                    : '0 4px 12px rgba(0, 0, 0, 0.1)',
                  position: 'relative',
                  zIndex: 3,
                  transform: activeStep === index ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.3s ease'
                }}
              >
                <span 
                  className="step-number"
                  style={{
                    color: 'white',
                    fontSize: '1.25rem',
                    fontWeight: '700'
                  }}
                >
                  {step.number}
                </span>
              </div>
              
              {/* Card content */}
              <div 
                className="step-card"
                style={{
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  textAlign: 'center',
                  minHeight: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  backgroundColor: step.bgColor,
                  border: '1px solid rgba(0, 0, 0, 0.04)',
                  transform: activeStep === index ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: activeStep === index 
                    ? '0 12px 30px rgba(0, 0, 0, 0.15)' 
                    : '0 4px 12px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s ease'
                }}
              >
                <h3 
                  className="step-title"
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#2D3748',
                    margin: '0 0 0.75rem 0',
                    lineHeight: '1.3'
                  }}
                >
                  {step.title}
                </h3>
                <p 
                  className="step-description"
                  style={{
                    fontSize: '0.875rem',
                    color: '#4A5568',
                    lineHeight: '1.5',
                    margin: '0 0 1.5rem 0',
                    flexGrow: 1
                  }}
                >
                  {step.description}
                </p>
                
                {/* Icon at bottom */}
                <div 
                  className="step-icon"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: 'auto'
                  }}
                >
                  <svg 
                    width="32" 
                    height="32" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke={step.iconColor} 
                    strokeWidth="1.5"
                    style={{
                      transform: activeStep === index ? 'scale(1.2)' : 'scale(1)',
                      transition: 'transform 0.3s ease'
                    }}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d={iconSvgs[step.number]} 
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease forwards;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .process-steps {
            flex-direction: column !important;
            align-items: center !important;
          }

          .process-step-wrapper {
            max-width: 100% !important;
            width: 100% !important;
          }

          .connection-line {
            display: none !important;
          }

          .step-card {
            min-height: 160px !important;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .step-title {
            color: #F7FAFC !important;
          }

          .step-description {
            color: #CBD5E0 !important;
          }

          .step-card {
            border-color: rgba(255, 255, 255, 0.1) !important;
          }

          .connection-line {
            background: linear-gradient(to right, #4A5568, #2D3748) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProcessFlow;
