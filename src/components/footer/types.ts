export interface ServiceBox {
  title: string;
  icon: string;
  services: string[];
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface FooterData {
  blog: {
    title: string;
    description: string;
    link: string;
  };
  brand: {
    title: string;
    tagline: string;
  };
  social: SocialLink[];
  newsletter: {
    title: string;
    placeholder: string;
    buttonText: string;
  };
  services: ServiceBox[];
  copyright: {
    year: number;
    company: string;
    tagline: string;
  };
}
