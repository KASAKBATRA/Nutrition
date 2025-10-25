import React, { useState } from 'react';

export function NutritionistRegisterForm({ setLocation, toast, isLoading, setIsLoading }: any) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    qualification: '',
    experience: '',
    specialization: '',
    licenseNumber: '',
    consultationMode: '',
    availableSlots: '',
    consultationFee: '',
    bio: '',
    languages: [],
  });

  const handleChange = (e: any) => {
    const { name, value, type, selectedOptions } = e.target;
    if (type === 'select-multiple') {
      setForm({ ...form, [name]: Array.from(selectedOptions, (option: any) => option.value) });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleRadioChange = (e: any) => {
    setForm({ ...form, consultationMode: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const [firstName, ...lastArr] = form.fullName.split(' ');
      const lastName = lastArr.join(' ');
      const payload = {
        role: 'nutritionist',
        firstName: firstName || '',
        lastName: lastName || '',
        email: form.email,
        password: form.password,
        confirmPassword: form.password,
        qualification: form.qualification,
        experience: Number(form.experience),
        specialization: form.specialization,
        licenseNumber: form.licenseNumber,
        consultationMode: form.consultationMode,
        availableSlots: form.availableSlots,
        consultationFee: Number(form.consultationFee),
        bio: form.bio,
        languages: form.languages,
      };
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Registration failed');
      toast({
        title: 'Registration Successful!',
        description: 'Please check your email for the verification code.',
      });
      setLocation(`/verify-otp?email=${encodeURIComponent(form.email)}&type=registration`);
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input className="w-full px-3 py-2 border rounded-lg" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Dr. Priya Sharma" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input className="w-full px-3 py-2 border rounded-lg" name="email" type="email" value={form.email} onChange={handleChange} placeholder="priya@example.com" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input className="w-full px-3 py-2 border rounded-lg" name="password" type="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Qualification</label>
          <input className="w-full px-3 py-2 border rounded-lg" name="qualification" value={form.qualification} onChange={handleChange} placeholder="M.Sc. Nutrition" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Years of Experience</label>
          <input className="w-full px-3 py-2 border rounded-lg" name="experience" type="number" min="0" value={form.experience} onChange={handleChange} placeholder="5" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Specialization</label>
          <select className="w-full px-3 py-2 border rounded-lg" name="specialization" value={form.specialization} onChange={handleChange} required>
            <option value="">Select</option>
            <option>Diabetes</option>
            <option>Weight Management</option>
            <option>Sports Nutrition</option>
            <option>Pregnancy Nutrition</option>
            <option>Other</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Registration/License Number (optional)</label>
          <input className="w-full px-3 py-2 border rounded-lg" name="licenseNumber" value={form.licenseNumber} onChange={handleChange} placeholder="ABC12345" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Consultation Mode</label>
          <div className="flex gap-2 mt-2">
            <label className="flex items-center"><input type="radio" name="consultationMode" value="Online" checked={form.consultationMode === 'Online'} onChange={handleRadioChange} required className="mr-2" />Online</label>
            <label className="flex items-center"><input type="radio" name="consultationMode" value="Offline" checked={form.consultationMode === 'Offline'} onChange={handleRadioChange} className="mr-2" />Offline</label>
            <label className="flex items-center"><input type="radio" name="consultationMode" value="Both" checked={form.consultationMode === 'Both'} onChange={handleRadioChange} className="mr-2" />Both</label>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Available Days & Time Slots</label>
          <input className="w-full px-3 py-2 border rounded-lg" name="availableSlots" value={form.availableSlots} onChange={handleChange} placeholder="Mon-Fri, 10am-2pm" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Consultation Fee (₹)</label>
          <input className="w-full px-3 py-2 border rounded-lg" name="consultationFee" type="number" min="0" value={form.consultationFee} onChange={handleChange} placeholder="500" required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Short Bio/Introduction</label>
        <textarea className="w-full px-3 py-2 border rounded-lg" name="bio" value={form.bio} onChange={handleChange} rows={2} placeholder="Write a short bio..." required></textarea>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Languages Spoken</label>
        <select className="w-full px-3 py-2 border rounded-lg" name="languages" multiple value={form.languages} onChange={handleChange} required>
          <option>English</option>
          <option>Hindi</option>
          <option>Punjabi</option>
          <option>Marathi</option>
          <option>Gujarati</option>
          <option>Other</option>
        </select>
      </div>
      <button type="submit" className="w-full bg-nutricare-green hover:bg-nutricare-dark text-white py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105">
        {isLoading ? (<div className="flex items-center justify-center"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>Creating Account...</div>) : ('Create Account')}
      </button>
    </form>
  );
}
