import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Nutritionist {
	id: string;
	specialization?: string;
	experience?: number;
	rating?: number;
	bio?: string;
	consultationFee?: number;
}

interface UserGridModalProps {
	isOpen: boolean;
	onClose: () => void;
	nutritionists: Nutritionist[];
	onSelect: (nutritionist: Nutritionist) => void;
}

const UserGridModal: React.FC<UserGridModalProps> = ({ isOpen, onClose, nutritionists, onSelect }) => {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="glass max-w-2xl">
				<DialogHeader>
					<DialogTitle>Select a Nutritionist</DialogTitle>
				</DialogHeader>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{nutritionists.map((nutritionist) => (
						<div key={nutritionist.id} className="p-4 rounded-xl glass shadow border border-white/30 flex flex-col justify-between">
							<div>
								<div className="flex items-center mb-2">
									<div className="w-10 h-10 bg-nutricare-green rounded-full flex items-center justify-center text-white font-bold mr-3">
										N
									</div>
									<div>
										<div className="font-semibold text-gray-900 dark:text-white">Dr. Nutritionist</div>
										<div className="text-xs text-gray-500">{nutritionist.specialization}</div>
									</div>
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
									<span className="font-medium">Experience:</span> {nutritionist.experience} years
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
									<span className="font-medium">Rating:</span> ⭐ {parseFloat(nutritionist.rating?.toString() || '0').toFixed(1)}
								</div>
								{nutritionist.consultationFee && (
									<div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
										<span className="font-medium">Fee:</span> ${parseFloat(nutritionist.consultationFee.toString()).toFixed(2)}
									</div>
								)}
								{nutritionist.bio && (
									<div className="text-xs text-gray-500 mt-1">{nutritionist.bio}</div>
								)}
							</div>
							<Button className="mt-4 bg-nutricare-green hover:bg-nutricare-dark" onClick={() => onSelect(nutritionist)}>
								Select
							</Button>
						</div>
					))}
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default UserGridModal;
