import { useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";

export default function Home() {
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    onDrop: (acceptedFiles) => setFile(acceptedFiles[0]),
  });

  const handleAnalyze = async () => {
    if (!file || !targetRole) {
      alert("Please provide a resume and target role.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("target_role", targetRole);

    try {
      const res = await axios.post("http://localhost:8000/analyze", formData);
      setResults(res.data);
    } catch (error) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-500 via-indigo-600 to-purple-600 flex justify-center items-center px-4 py-10">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-8 space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-800">ResumeGPT</h1>
          <p className="text-sm text-gray-500 mt-1">Smart ATS scoring & resume feedback</p>
        </div>

        <input
          type="text"
          placeholder="Target job title (e.g. Product Manager)"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div
          {...getRootProps()}
          className="border-2 border-dashed p-6 rounded-md bg-gray-50 text-center cursor-pointer hover:bg-gray-100 transition"
        >
          <input {...getInputProps()} />
          <p className="text-gray-600">{file ? file.name : "Upload your resume (PDF only)"}</p>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md font-semibold transition"
        >
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>

        {results && (
          <div className="bg-gray-50 p-5 rounded-lg mt-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-700">🎯 ATS Score: {results.overall_score}/100</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.category_scores &&
                Object.entries(results.category_scores).map(([key, val], idx) => (
                  <div key={idx} className="p-3 rounded-md border bg-white shadow-sm">
                    <p className="font-semibold capitalize">{key.replace(/_/g, " ")}</p>
                    <p className="text-blue-600 font-bold">{val}/10</p>
                    <p className="text-sm text-gray-500 mt-1">{results.feedback?.[key]}</p>
                  </div>
                ))}
            </div>

            {results.recommended_keywords?.length > 0 && (
              <div>
                <h3 className="font-semibold mt-4 text-gray-700">📌 Suggested Keywords</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {results.recommended_keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {results.bullet_point_rewrites?.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-700 mb-2">✍️ Bullet Point Suggestions</h3>
                {results.bullet_point_rewrites.map((bp, i) => (
                  <div key={i} className="mb-3 bg-white p-3 rounded shadow">
                    <p className="text-sm">
                      <span className="text-red-500 font-semibold">Original:</span> {bp.original}
                    </p>
                    <p className="text-sm">
                      <span className="text-green-600 font-semibold">Suggested:</span> {bp.suggested}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {results.summary && (
              <div className="mt-4 bg-white p-4 rounded shadow text-sm">
                <h4 className="text-indigo-700 font-semibold">🧠 Coach Summary</h4>
                <p className="text-gray-700">{results.summary}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
