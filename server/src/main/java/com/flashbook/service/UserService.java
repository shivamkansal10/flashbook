package com.flashbook.service;

import com.flashbook.dto.auth.UpdateProfileRequest;
import com.flashbook.dto.auth.UserDto;
import com.flashbook.entity.User;
import com.flashbook.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public UserDto updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        user.setFullName(request.getFullName());
        User savedUser = userRepository.save(user);
        return UserDto.fromEntity(savedUser);
    }
}
