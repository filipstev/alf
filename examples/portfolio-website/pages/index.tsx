import { signal } from "../../../src/core";
import { navigate } from "../../../src/router";
import { Layout } from "../src/components/Layout";

const typedText = signal("");
const currentIndex = signal(0);

const roles = [
  "Full-Stack Developer",
  "React Enthusiast",
  "UI/UX Designer",
  "Open Source Contributor",
];

// Typing animation effect
const startTypingAnimation = () => {
  const typeText = (text: string, callback?: () => void) => {
    typedText.set("");
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        typedText.set(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        setTimeout(() => {
          // Erase text
          const eraseTimer = setInterval(() => {
            if (typedText().length > 0) {
              typedText.set(typedText().slice(0, -1));
            } else {
              clearInterval(eraseTimer);
              callback?.();
            }
          }, 50);
        }, 2000);
      }
    }, 100);
  };

  const cycleText = () => {
    const current = roles[currentIndex()];
    typeText(current, () => {
      currentIndex.set((currentIndex() + 1) % roles.length);
      setTimeout(cycleText, 500);
    });
  };

  cycleText();
};

// Start animation when component mounts
setTimeout(startTypingAnimation, 1000);

const skills = [
  { name: "React", icon: "⚛️", level: 95 },
  { name: "TypeScript", icon: "🔷", level: 90 },
  { name: "Node.js", icon: "🟢", level: 88 },
  { name: "Python", icon: "🐍", level: 85 },
  { name: "PostgreSQL", icon: "🐘", level: 80 },
  { name: "AWS", icon: "☁️", level: 75 },
];

const projects = [
  {
    id: 1,
    title: "E-Commerce Platform",
    description:
      "Full-stack e-commerce solution with React, Node.js, and Stripe integration",
    image: "/assets/project1.jpg",
    tags: ["React", "Node.js", "Stripe", "PostgreSQL"],
    github: "https://github.com/johndoe/ecommerce",
    live: "https://ecommerce-demo.com",
  },
  {
    id: 2,
    title: "Task Management App",
    description:
      "Collaborative task management with real-time updates using WebSockets",
    image: "/assets/project2.jpg",
    tags: ["Vue.js", "Socket.io", "MongoDB", "Express"],
    github: "https://github.com/johndoe/taskmanager",
    live: "https://taskmanager-demo.com",
  },
  {
    id: 3,
    title: "AI Chat Bot",
    description:
      "Intelligent chatbot with natural language processing capabilities",
    image: "/assets/project3.jpg",
    tags: ["Python", "TensorFlow", "FastAPI", "Redis"],
    github: "https://github.com/johndoe/chatbot",
    live: "https://chatbot-demo.com",
  },
];

export default function HomePage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Hi, I'm{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  John Doe
                </span>
              </h1>
              <div className="text-2xl lg:text-3xl text-gray-600 mb-8 h-12">
                <span className="border-r-2 border-blue-600 animate-pulse">
                  {typedText()}
                </span>
              </div>
              <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl">
                I'm passionate about creating beautiful, functional web
                experiences that solve real-world problems. With 5+ years of
                experience in full-stack development, I love turning ideas into
                reality.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate("/projects")}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                >
                  View My Work
                </button>
                <button
                  onClick={() => navigate("/contact")}
                  className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-medium hover:bg-blue-600 hover:text-white transition-colors"
                >
                  Get In Touch
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="w-80 h-80 mx-auto bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-8xl shadow-2xl">
                👨‍💻
              </div>
              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center text-2xl animate-bounce">
                ⚡
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-green-400 rounded-full flex items-center justify-center text-xl animate-pulse">
                🚀
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Skills & Technologies
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Here are the tools and technologies I work with to bring ideas to
              life
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {skills.map((skill) => (
              <div
                key={skill.name}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{skill.icon}</span>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {skill.name}
                  </h3>
                </div>
                <div className="relative">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Proficiency</span>
                    <span>{skill.level}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Projects
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A showcase of some of my recent work and personal projects
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl">
                  🖥️
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <a
                      href={project.github}
                      className="flex-1 text-center bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      GitHub
                    </a>
                    <a
                      href={project.live}
                      className="flex-1 text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Live Demo
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={() => navigate("/projects")}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              View All Projects
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Let's Work Together
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            I'm always interested in new opportunities and exciting projects.
            Whether you have a project in mind or just want to chat about tech,
            I'd love to hear from you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => navigate("/contact")}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-lg"
            >
              Get In Touch
            </button>
            <a
              href="mailto:john@example.com"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-medium hover:bg-white hover:text-blue-600 transition-colors"
            >
              Send Email
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
