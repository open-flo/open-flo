import { useEffect, useRef } from "react"

interface NudgePreviewProps {
  config: any
  className?: string
}

export function NudgePreview({ config, className = "" }: NudgePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const generateHTMLContent = () => {
    if (!config) return ""
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nudge Studio Preview</title>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            background: white;
            background-image: radial-gradient(circle, #e0e0e0 1px, transparent 1px);
            background-size: 20px 20px;
            min-height: 100vh;
          }
        </style>
      </head>
      <body>
        <script src="https://cdn.flowvana.tech/flowlight.umd.js"></script>
        <script>
          // Initialize FlowLight with debug options
          const flowLightInstance = new FlowLight(
              ${JSON.stringify(config, null, 8)}
          );
          
          // Demo functions for nudges
          function showDemoNudge() {
            if (window.flowLightInstance) {
              console.log('Showing demo nudge...');
              // This would trigger a nudge in the real implementation
            }
          }
          
          function hideDemoNudge() {
            if (window.flowLightInstance) {
              console.log('Hiding demo nudge...');
              // This would hide a nudge in the real implementation
            }
          }
        </script>
      </body>
      </html>
    `
  }

  // Update iframe content when config changes
  useEffect(() => {
    if (iframeRef.current && config) {
      const iframe = iframeRef.current
      iframe.srcdoc = generateHTMLContent()
    }
  }, [config])

  return (
    <iframe
      ref={iframeRef}
      srcDoc={generateHTMLContent()}
      className={`w-full h-[calc(100vh-200px)] border-0 ${className}`}
      title="Nudge Studio Preview"
    />
  )
}