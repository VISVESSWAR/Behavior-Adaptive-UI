import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdaptiveButton from "../components/AdaptiveButton";
import AdaptiveInput from "../components/AdaptiveInput";
import {
  AdaptiveHeading,
  AdaptiveParagraph,
  AdaptiveLabel,
  AdaptiveLink,
} from "../components/AdaptiveText";
import useMouseTracker from "../hooks/useMouseTracker";
import useIdleTimer from "../hooks/useIdleTimer";
import useScrollDepth from "../hooks/useScrollDepth";
import { logEvent } from "../logging/eventLogger";

const SERVICES = [
  { id: 1, name: "Money Transfer", price: "$25.00", icon: "💸" },
  { id: 2, name: "Bill Payment", price: "$15.00", icon: "📄" },
  { id: 3, name: "Purchase", price: "$50.00", icon: "🛍️" },
  { id: 4, name: "Subscription", price: "$9.99", icon: "📦" },
];

export default function Transaction() {
  const flowId = "transaction";
  const navigate = useNavigate();
  const [stepId, setStepId] = useState("select_service");
  const [selectedService, setSelectedService] = useState(null);
  const [amount, setAmount] = useState("");

  useMouseTracker(flowId, stepId);
  useIdleTimer(flowId, stepId);
  useScrollDepth(flowId, stepId);

  useEffect(() => {
    logEvent({ type: "step_enter", flowId, stepId });
  }, [stepId]);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    logEvent({
      type: "service_selected",
      flowId,
      service: service.name,
    });
    setStepId("confirm_payment");
  };

  const handlePayment = () => {
    setStepId("processing");
    logEvent({
      type: "payment_attempt",
      flowId,
      service: selectedService.name,
      amount,
    });
    setTimeout(() => {
      setStepId("success");
      setTimeout(() => navigate("/dashboard"), 2000);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <AdaptiveHeading level={1} className="text-gray-900 mb-2">
          Transaction / Booking
        </AdaptiveHeading>
        <AdaptiveParagraph className="text-gray-600">
          Complete a transaction securely
        </AdaptiveParagraph>
      </div>

      {stepId === "select_service" && (
        <div>
          <AdaptiveParagraph className="text-gray-700 mb-6">
            Choose a service:
          </AdaptiveParagraph>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {SERVICES.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                className="card-base text-center hover:border-blue-500 hover:border-2 transform hover:scale-105"
              >
                <div className="text-4xl mb-3">{service.icon}</div>
                <AdaptiveHeading level={3} className="text-gray-900 mb-2">
                  {service.name}
                </AdaptiveHeading>
                <p className="text-blue-600 font-bold text-lg">
                  {service.price}
                </p>
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <AdaptiveLink
              as={Link}
              to="/dashboard"
              className="adaptive-element px-6 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 shadow-sm hover:shadow-md"
            >
              Cancel
            </AdaptiveLink>
          </div>
        </div>
      )}

      {stepId === "confirm_payment" && selectedService && (
        <div className="max-w-md mx-auto">
          <div className="card-base mb-8">
            <AdaptiveHeading level={2} className="text-gray-900 mb-6">
              Review Transaction
            </AdaptiveHeading>

            <div className="space-y-4 mb-8 pb-8 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <AdaptiveLabel className="text-gray-600">Service</AdaptiveLabel>
                <span className="font-semibold text-gray-900">
                  {selectedService.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <AdaptiveLabel className="text-gray-600">Amount</AdaptiveLabel>
                <span className="font-semibold text-gray-900">
                  {selectedService.price}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <AdaptiveLabel className="text-gray-600">Status</AdaptiveLabel>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  Pending
                </span>
              </div>
            </div>

            <div className="mb-6">
              <AdaptiveLabel className="block text-gray-700 mb-2">
                Recipient / Details (optional)
              </AdaptiveLabel>
              <AdaptiveInput
                type="text"
                placeholder="Enter recipient details"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <AdaptiveButton
                onClick={() => setStepId("select_service")}
                className="flex-1 bg-gray-400 hover:bg-gray-500"
              >
                Back
              </AdaptiveButton>
              <AdaptiveButton
                onClick={handlePayment}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Confirm Payment
              </AdaptiveButton>
            </div>
          </div>
        </div>
      )}

      {stepId === "processing" && (
        <div className="card-base max-w-md mx-auto text-center py-12">
          <div className="inline-block">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
          </div>
          <AdaptiveHeading level={3} className="text-gray-900 mb-2">
            Processing Payment
          </AdaptiveHeading>
          <AdaptiveParagraph className="text-gray-600">
            Please wait while we process your transaction...
          </AdaptiveParagraph>
        </div>
      )}

      {stepId === "success" && (
        <div className="card-base max-w-md mx-auto text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <AdaptiveHeading level={2} className="text-gray-900 mb-2">
            Payment Successful!
          </AdaptiveHeading>
          <AdaptiveParagraph className="text-gray-600 mb-2">
            Your transaction has been completed
          </AdaptiveParagraph>
          <AdaptiveParagraph className="text-gray-500">
            Redirecting to dashboard...
          </AdaptiveParagraph>
        </div>
      )}
    </div>
  );
}
